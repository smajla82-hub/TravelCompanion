The Core Engine contains all business knowledge of the Travel Companion platform.

                    Clients
        ┌────────────────────────────┐
        │ Windows │ Android │ Web │
        └─────────────┬──────────────┘
                      │
                Application Layer
        ┌────────────────────────────┐
        │ Commands │ Queries │ UI API│
        └─────────────┬──────────────┘
                      │
                  Core Engine
        ┌────────────────────────────┐
        │ Domains │ Rules │ Events   │
        └─────────────┬──────────────┘
                      │
              Infrastructure
        ┌────────────────────────────┐
        │ SQLite │ Files │ Import    │
        └────────────────────────────┘