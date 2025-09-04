export default function Card({ cover, title, year, artists }) {
  return (
    <figure className="figure">
      {cover ? (
        <img
          src={cover}
          alt={title}
          width={140}
          height={140}
          className="cover"
          loading="lazy"
        />
      ) : (
        <div className="cover-placeholder" />
      )}
      <figcaption className="caption">
        <strong>{artists}</strong>
        <br />
        {title} {year ? `(${year})` : ""}
      </figcaption>
    </figure>
  );
}
