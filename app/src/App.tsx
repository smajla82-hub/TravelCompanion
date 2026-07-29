import MainLayout from "./layouts/MainLayout";
import AppRouter from "./routes/AppRouter";
import { Providers } from "./app/providers";

function App() {
    return (
        <Providers>
            <MainLayout>
                <AppRouter />
            </MainLayout>
        </Providers>
    );
}

export default App;