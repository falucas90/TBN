
export default function Card({ children, style, className = '', noPadding = false, hover = false }) {
  return (
    <div className={`card ${hover ? 'card--hover' : ''} ${className}`} style={style}>
      {noPadding ? children : <div className="card__body">{children}</div>}
    </div>
  );
}
