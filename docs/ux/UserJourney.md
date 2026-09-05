# Travel Companion — Mobile UI Design Specification

## 1. Design direction

Overall style:

- modern mobile travel application
- clean, premium but practical
- rounded cards
- soft shadows
- strong visual hierarchy
- blue/purple primary branding
- green for positive/active/recommended states
- Light Mode + Dark Mode
- responsive/mobile-first
- typography: Inter

## 2. Color system — Light Mode

| Token | Value | Použití |
|---|---|---|
| primary | #2563EB | hlavní CTA, aktivní prvky |
| primary-dark | #1E40AF | tmavší varianty primary |
| success | #10B981 | Active Trip, Recommended, pozitivní stav |
| accent-purple | #8B5CF6 | sekundární akce, ikony |
| accent-blue | #38BDF8 | sekundární modré akcenty |
| text-primary | #0F172A | hlavní text |
| text-secondary | #64748B | sekundární text |
| background | #F8FAFC | hlavní pozadí |
| surface | #FFFFFF | karty |
| border | #E5E7EB | jemné okraje |

**Poznámka:** V původním obrázku je u barev dvakrát uvedeno Accent Purple a několik hex hodnot je kvůli rozlišení mockupu špatně čitelných. Výše je to normalizováno do jednoznačného design-tokenového seznamu.

## 3. Dark Mode

| Token | Value | Použití |
|---|---|---|
| primary | #60A5FA | hlavní CTA / primary |
| primary-dark | #3B82F6 | tmavší primary |
| success | #10B981 | Active Trip / pozitivní stav |
| accent-purple | #8B5CF6 | sekundární akce |
| accent-blue | #38BDF8 | modré akcenty |
| text-primary | #F8FAFC | hlavní text |
| text-secondary | #94A3B8 | sekundární text |
| background | #0F172A | hlavní pozadí |
| surface | #18212F | karty |
| border | #334155 | okraje |

Dark Mode nemá být pouze invertovaná Light Mode. Karty musí zůstat vizuálně oddělené od pozadí.

## 4. Typography

Font: **Inter**

| Style | Size / Line-height | Weight |
|---|---|---|
| H1 | 22px / 28px | 700 |
| H2 | 18px / 24px | 600 |
| H3 | 16px / 20px | 600 |
| Body | 14px / 20px | 400 |
| Caption | 12px / 16px | 400 |
| Button | 14px / 16px | 500 |

Doporučení pro aplikaci:
- název tripu › H1/H2 podle kontextu
- název sekce › H2
- název aktivity › H3
- detail aktivity › Body
- pomocné informace › Caption
- tlačítka › Button

## 5. Cards

Card radius: 16px

Karty mají:
- `border-radius: 16px`

Light Mode:
- `background: #FFFFFF`
- `box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08)`

Dark Mode:
- `background: #18212F`
- `box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45)`

Border může být použit zejména v Dark Mode pro lepší oddělení:
- `border: 1px solid #334155`

## 6. Buttons

### Primary button

Použití:
- New Trip
- Continue Trip
- Save
- hlavní akce

`height: 44–48px`, `border-radius: 12px`, `font-size: 14px`, `font-weight: 500`

Light:
- `background: #2563EB`
- `color: #FFFFFF`

Dark:
- `background: #3B82F6`
- `color: #FFFFFF`

### Secondary button

Použití:
- My Trips
- View whole itinerary
- méně důležité akce

Light:
- `background: #FFFFFF`
- `color: #0F172A`
- `border: 1px solid #E5E7EB`

Dark:
- `background: transparent`
- `color: #F8FAFC`
- `border: 1px solid #334155`

### Success / positive action

- `background: #10B981`
- `color: #FFFFFF`

Použití například:
- Active Trip
- Recommended
- Completed
- Confirmed

## 7. Icon system

Ikony nesmí být obrázky.

Použít SVG icon system (inline SVG v tomto projektu — žádná nová npm závislost).

Základní pravidla:
- Style: Linear
- Stroke width: 2px
- Stroke linecap: round
- Stroke linejoin: round
- No filled icons except where explicitly required

Ikony mají být konzistentní napříč celou aplikací.

### Icon mapping

**Navigation**
- Home › Home
- Settings › Settings
- My Trips › Briefcase / Luggage
- New Trip › Plus
- View whole itinerary › CalendarDays

**Trip**
- Travellers › UsersRound
- Active Trip › Circle / CheckCircle
- Trip destination › MapPin
- Trip dates › CalendarDays

**Activity**
- Food / Restaurant › Utensils
- Parking › SquareParking (P badge)
- Statistics › BarChart
- Location › MapPin
- Activity Type › canonical semantic SVG icon
- Priority › Zap
- Flight › Plane
- Price › DollarSign
- Note › NotebookPen (pencil/note)
- Next Activity › ChevronRight

**Action icons**
- Recommended › Star
- Expand › ChevronDown
- Collapse › ChevronUp
- More › MoreHorizontal
- Close › X
- Edit › Pencil
- Delete › Trash2

## 8. Icon colors

Ikona nemusí být vždy stejná barva jako text.

Doporučené mapování:
- Primary: #2563EB
- Purple: #8B5CF6
- Success: #10B981
- Blue: #38BDF8
- Text: #0F172A / #F8FAFC
- Secondary: #64748B / #94A3B8

Například:
- Food › Success / Green
- Parking › Purple
- Statistics › Blue
- Flight › Accent Blue
- Priority › Primary
- Price › Success

## 9. Icon containers

Pokud je ikona umístěna v samostatném boxu:
- `border-radius: 12px`

Například tlačítko s ikonou a popiskem (Recommended / Parking), box:
- `background: surface`
- `border: 1px solid border`
- `border-radius: 12px`

Ikona:
- 24px
- `stroke-width: 2px`

## 10. Current Activity

Toto je důležitá část celého designu.

**Current Activity má být vizuálně dominantní část dne.**

Struktura:

```
CURRENT ACTIVITY

07:00    [Food icon]   Snídaně

📍 Praha
[Activity Type icon] Food
⚡ Priority: FOOD
🅿️ Parking: P1
✈ Prague International Airport (PRG)
$ Price: 15–20 USD
📝 Note: Lehčí snídaně před odletem
```

Vedle detailu (uvnitř stejné karty/výseče, ne mimo ni) mají být akční shortcuty, vertikálně naskládané:

```
┌───────────────┐
│      🍴       │
│  Recommended  │
│     FOOD      │
└───────────────┘

┌───────────────┐
│      🅿️       │
│    Parking    │
└───────────────┘

┌───────────────┐
│      📊       │
│  Statistics   │
└───────────────┘
```

## 11. Next Activity

Next Activity má být vizuálně méně dominantní než Current Activity.

```
NEXT ACTIVITY

09:35    [Plane]   Odlet z Prahy
                   Praha

              •••
           Show more
```

Current Activity = detail.
Next Activity = rychlý náhled.

Current Activity's **“Show more”** opens the active day's remaining-activities view: the current and upcoming timed activities plus activities without a valid time. If every timed activity is finished, it can show **“All activities for today are finished.”**  
**View Whole Itinerary** always opens complete day history for the selected day; historical and future days are not filtered.

## 12. Top background

Modré/purple branded background, který se používá v horní části aplikace.

Obsah:

```
Travel Companion

Current Trip / dashboard hero
```

The approved artwork is bundled locally, not CSS/SVG-only decoration: `top-background800x800.webp` is used in the top header and `hero-background1200x600.webp` in the hero. Its positioning and spacing are intentional parts of the 9.7B mobile baseline and must not compete with content.

The top header does not contain Settings, New Trip or My Trips.

## 13. Bottom navigation

Bundled `bottom-nav-background1200x300.webp` provides the branded bottom-navigation background.

```
┌──────────────────────────────────┐
│     🏠          ⚙                │
│    Home       Settings           │
└────────────���─────────────────────┘
```

(V aktuální implementaci aplikace jsou tři položky: Home, My Trips, Settings.)

Ikony:
- Home
- My Trips
- Settings

New Trip is available from **My Trips**, not from the top header.

Active: white
Inactive: white / reduced opacity

V Dark Mode zůstává bottom navigation tmavší modrofialová.

## 14. Spacing

Doporučuji držet 8px spacing system:

- 4px micro
- 8px xs
- 12px sm
- 16px md
- 24px lg
- 32px xl

Typické použití:
- Card padding: 16px
- Section gap: 24px
- Element gap: 8–12px
- Button gap: 12px
- Main mobile page horizontal padding: 12px

## 15. Responsive behaviour

Mobile-first.

Mobile is the authoritative visual target. The branded top header, hero and bottom navigation use their approved bundled raster artwork and spacing.

Na telefonu:
- 1 column

Na širším displeji může být:
- 2 columns

ale Current Activity nesmí být kvůli gridu příliš stlačená.

Priorita:
1. Current Trip
2. Itinerary
3. Current Activity
4. Next Activity
5. Secondary actions

---

## SUMMARY

Implement the Travel Companion mobile UI using a modern premium travel-app design.

Use:
- React
- TypeScript
- mobile-first responsive layout
- Inter font
- Light Mode + Dark Mode
- inline SVG icons (no new icon library dependency)
- linear icons
- 2px icon stroke
- round line caps and joins
- no raster images for icons

Design tokens:

Primary: #2563EB
Primary Dark: #1E40AF
Success: #10B981
Accent Purple: #8B5CF6
Accent Blue: #38BDF8

Light:
Background: #F8FAFC
Surface: #FFFFFF
Text Primary: #0F172A
Text Secondary: #64748B
Border: #E5E7EB

Dark:
Background: #0F172A
Surface: #18212F
Text Primary: #F8FAFC
Text Secondary: #94A3B8
Border: #334155

Typography:
H1 22/28 Bold
H2 18/24 Semibold
H3 16/20 Semibold
Body 14/20 Regular
Caption 12/16 Regular
Button 14/16 Medium

Cards:
radius 16px
padding 16px

Icon containers:
radius 12px
icon size approximately 24px
stroke width 2px

Light shadow:
0 4px 16px rgba(15, 23, 42, 0.08)

Dark shadow:
0 4px 16px rgba(0, 0, 0, 0.45)

Primary buttons:
44–48px height
12px radius

Use the blue/purple branded background for the top header and bottom navigation.

Current Activity must be the visual focal point of the itinerary — its Food/Parking/Statistics action shortcuts must render inside the same card/block as the activity's details, not detached outside of it.

Next Activity should be a compact preview.

Activity Type is an explicit semantic `ItineraryItem.activityType` classification, not a value inferred from Priority or title emoji. The canonical registry supplies its SVG icon; unknown or missing values resolve to `other`. Existing title emojis remain where already stored. The legacy `goal` field is deprecated/backward-compatible and is not populated or rendered by the current importer/UI.

Canonical Activity Types: `food`, `flight`, `transport`, `scenic`, `nature`, `walk`, `sightseeing`, `event`, `shopping`, `accommodation`, `parking`, `car_rental`, `travel_prep`, `airport`, `rest`, and `other`.

Current text validation limits are: Trip Name 40, Day Title 40, Activity Title 40, Location 26, Price 26, Note 60, and Map Link 2048 characters. Description is deprecated/removed from the current form and import flow. Invalid imported activity rows are skipped with warnings while valid rows and days continue importing; existing stored over-limit data stays readable and is not silently truncated.

Do not use the screenshot as a source of truth for text, data or layout dimensions.
Use the existing application's domain model and components.
The screenshot is only a visual design reference.
