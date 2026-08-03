type NewTripFormProps = {
    children: React.ReactNode;
};

export function NewTripForm({
    children,
}: NewTripFormProps) {
    return (
        <form className="tc-trip-form">
            {children}
        </form>
    );
}