import "./Card.css";

type CardProps = {
  children: React.ReactNode;
};

export function Card({ children }: CardProps) {
  return <div className="tc-card">{children}</div>;
}