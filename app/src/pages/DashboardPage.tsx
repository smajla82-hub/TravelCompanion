import { Container, Grid, Heading } from "../components/ui";
import { CurrentTripCard } from "../components/cards";

export default function DashboardPage() {
    return (
        <Container>
            <Heading level={1}>
                Travel Companion
            </Heading>

            <Grid columns={2}>
                <CurrentTripCard />
            </Grid>
        </Container>
    );
}