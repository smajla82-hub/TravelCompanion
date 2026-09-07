import { afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
            removeItem: (key: string) => storage.delete(key),
        },
    });
});

import { createTripAdapter, toOnlineTrip } from "./TripAdapter";
import { SyncedTripApi, type SyncedTrip } from "../api/trips";
import { ActiveTripSelectionStore } from "./ActiveTripSelection";
import { OnlineTripStore } from "./OnlineTripStore";

function serverTrip(overrides: Partial<SyncedTrip> = {}): SyncedTrip {
    return {
        id: "trip-1",
        name: "Garda",
        destination: "Riva del Garda",
        country: "Italy",
        startDate: "2026-09-01",
        endDate: "2026-09-05",
        travellers: 2,
        status: "planning",
        ...overrides,
    };
}

describe("toOnlineTrip", () => {
    it("marks the server side active trip as active", () => {
        expect(toOnlineTrip(serverTrip({ isActive: true }))).toMatchObject({
            status: "active",
            source: "online",
            name: "Garda",
        });
    });

    describe("online Trip adapter", () => {
        afterEach(() => {
            vi.restoreAllMocks();
            ActiveTripSelectionStore.clear();
            OnlineTripStore.reset();
        });

        it("updates the server name with the edited destination for consistent labels", async () => {
            vi.spyOn(SyncedTripApi, "acquireLock").mockResolvedValue({});
            vi.spyOn(SyncedTripApi, "releaseLock").mockResolvedValue({});
            const update = vi.spyOn(SyncedTripApi, "update")
                .mockResolvedValue(serverTrip({ name: "Olomouc", destination: "Olomouc" }));

            const saved = await createTripAdapter({
                ...serverTrip({ name: "Brno", destination: "Brno" }),
                source: "online",
            }).updateTrip({
                ...toOnlineTrip(serverTrip({ name: "Brno", destination: "Brno" })),
                destination: "Olomouc",
            });

            expect(update).toHaveBeenCalledWith(
                "trip-1",
                expect.objectContaining({
                    destination: "Olomouc",
                    name: "Olomouc",
                }),
            );
            expect(saved).toMatchObject({
                destination: "Olomouc",
                name: "Olomouc",
            });
        });

        it("stores the explicit current-device online selection when activated", async () => {
            vi.spyOn(SyncedTripApi, "acquireLock").mockResolvedValue({});
            vi.spyOn(SyncedTripApi, "releaseLock").mockResolvedValue({});
            vi.spyOn(SyncedTripApi, "setActive")
                .mockResolvedValue(serverTrip({ id: "online-a", isActive: true }));

            const activeTrip = await createTripAdapter({
                ...serverTrip({ id: "online-a" }),
                source: "online",
            }).setActive();

            expect(activeTrip).toMatchObject({
                id: "online-a",
                status: "active",
            });

            expect(ActiveTripSelectionStore.get()).toEqual({
                source: "online",
                id: "online-a",
            });
        });

        it("updates the cached itinerary after online activity mutations", async () => {
            const adapter = createTripAdapter({
                ...serverTrip(),
                source: "online",
            });
            const day = { id: "day-1", date: "2026-09-01", title: "Day 1", items: [] };
            OnlineTripStore.applyTrip({
                ...toOnlineTrip(serverTrip()),
                itinerary: [day],
                itineraryLoaded: true,
            });
            vi.spyOn(SyncedTripApi, "acquireLock").mockResolvedValue({});
            vi.spyOn(SyncedTripApi, "releaseLock").mockResolvedValue({});
            vi.spyOn(SyncedTripApi, "createItem").mockResolvedValue({
                id: "item-2", date: day.date, title: "Added",
            });
            vi.spyOn(SyncedTripApi, "updateItem").mockResolvedValue({
                id: "item-1", date: day.date, title: "Edited",
            });
            vi.spyOn(SyncedTripApi, "deleteItem").mockResolvedValue({
                deleted: true, item: { id: "item-1", date: day.date, title: "Edited" },
            });
            const itinerary = vi.spyOn(SyncedTripApi, "itinerary")
                .mockResolvedValueOnce({
                    tripId: "trip-1",
                    days: [{ ...day, items: [{ id: "item-2", date: day.date, title: "Added" }] }],
                })
                .mockResolvedValueOnce({
                    tripId: "trip-1",
                    days: [{ ...day, items: [{ id: "item-2", date: day.date, title: "Edited" }] }],
                })
                .mockResolvedValueOnce({ tripId: "trip-1", days: [{ ...day, items: [] }] });

            await adapter.addItem(day, { title: "Added" });
            await adapter.updateItem(day, "item-2", { title: "Edited" });
            await adapter.deleteItem(day, "item-2");

            expect(itinerary).toHaveBeenCalledTimes(3);
            expect(OnlineTripStore.getSnapshot()[0].itinerary).toEqual([{ ...day, items: [] }]);
        });

        it("sends and applies recommended venues and parking locations when replacing the itinerary", async () => {
            const adapter = createTripAdapter({
                ...serverTrip(),
                source: "online",
            });
            OnlineTripStore.applyTrip({
                ...toOnlineTrip(serverTrip()),
                itinerary: [],
                itineraryLoaded: true,
            });
            vi.spyOn(SyncedTripApi, "acquireLock").mockResolvedValue({});
            vi.spyOn(SyncedTripApi, "releaseLock").mockResolvedValue({});

            const venues = [{ id: "v1", name: "Caffe Roma", mapLink: "https://maps.example.com/caffe" }];
            const parkingLocations = [{ id: "p1", code: "P1", name: "Central Garage" }];
            const persistedDay = {
                id: "day-1",
                date: "2026-09-01",
                title: "Day 1",
                items: [{ id: "item-1", date: "2026-09-01", title: "Breakfast", parking: "P1" }],
                venues,
                parkingLocations,
            };
            const replaceItinerary = vi.spyOn(SyncedTripApi, "replaceItinerary")
                .mockResolvedValue({ tripId: "trip-1", days: [persistedDay] });

            await adapter.setItinerary([{
                id: "local-day-1",
                date: "2026-09-01",
                title: "Day 1",
                items: [{ id: "local-item-1", date: "2026-09-01", title: "Breakfast", parking: "P1" }],
                venues,
                parkingLocations,
            }]);

            expect(replaceItinerary).toHaveBeenCalledWith("trip-1", [
                expect.objectContaining({ venues, parkingLocations }),
            ]);
            expect(OnlineTripStore.getSnapshot()[0].itinerary).toEqual([persistedDay]);
        });

        it("does not introduce venues/parkingLocations keys for a day that has none of either", async () => {
            const adapter = createTripAdapter({
                ...serverTrip(),
                source: "online",
            });
            vi.spyOn(SyncedTripApi, "acquireLock").mockResolvedValue({});
            vi.spyOn(SyncedTripApi, "releaseLock").mockResolvedValue({});
            const persistedDay = { id: "day-1", date: "2026-09-01", title: "Day 1", items: [], venues: [], parkingLocations: [] };
            const replaceItinerary = vi.spyOn(SyncedTripApi, "replaceItinerary")
                .mockResolvedValue({ tripId: "trip-1", days: [persistedDay] });

            await adapter.setItinerary([{ id: "local-day-1", date: "2026-09-01", title: "Day 1", items: [] }]);

            expect(replaceItinerary).toHaveBeenCalledWith("trip-1", [
                expect.objectContaining({ venues: undefined, parkingLocations: undefined }),
            ]);
        });
    });

    it("does not treat a non active trip as active", () => {
        expect(toOnlineTrip(serverTrip({ status: "active", isActive: false })).status)
            .toBe("planning");
    });

    it("keeps the stored status when the server omits the active flag", () => {
        expect(toOnlineTrip(serverTrip({ status: "finished" })).status).toBe("finished");
    });
});
