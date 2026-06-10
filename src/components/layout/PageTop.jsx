export default function PageTop({ title, sub, right }) {
  return (
    <div className="page__top">
      <div>
        <div className="page__title">{title}</div>
        {sub && <div className="page__sub">{sub}</div>}
      </div>
      <div className="row gap-2">{right}</div>
    </div>
  );
}
