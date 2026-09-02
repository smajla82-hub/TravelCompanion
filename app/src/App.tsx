import { useEffect } from "react";

import MainLayout from "./layouts/MainLayout";
import AppRouter from "./routes/AppRouter";
import { Providers } from "./app/providers";
import { ThemeService } from "./services/ThemeService";

function App() {
    useEffect(() => {
        ThemeService.applyStoredTheme();
    }, []);

    return (
        <Providers>
            <MainLayout>
                <AppRouter />
            </MainLayout>
        </Providers>
    );
}

export default App;