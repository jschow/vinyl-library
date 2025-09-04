import Card from "./Card";

export default function CardContainer({ items }) {
  return (
    <div className="grid">
      {items.map((x) => (
        <Card
          key={x.id}
          cover={x.cover}
          title={x.title}
          year={x.year}
          artists={x.artists}
        />
      ))}
    </div>
  );
}
