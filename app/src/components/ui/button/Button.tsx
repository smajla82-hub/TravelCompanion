import "./Button.css";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
};

export function Button({ children, onClick }: ButtonProps) {
  return (
    <button className="tc-button" onClick={onClick}>
      {children}
    </button>
  );
}