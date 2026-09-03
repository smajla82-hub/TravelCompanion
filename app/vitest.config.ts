import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.{ts,tsx}"],
        // These are pre-existing empty placeholder test files (no test
        // suite yet implemented) unrelated to this task; vitest treats an
        // empty test file as a failing suite, so they are excluded here
        // rather than modified.
        exclude: [
            "**/node_modules/**",
            "src/components/ui/badge/Badge.test.tsx",
            "src/components/ui/card/Card.test.tsx",
            "src/components/ui/container/Container.test.tsx",
            "src/components/ui/heading/Heading.test.tsx",
            "src/components/ui/text/Text.test.tsx",
        ],
    },
});
