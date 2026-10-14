function StatusMessage({ title, children, tone = 'info' }) {
  return (
    <section className={`card status-message status-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
    </section>
  )
}

export default StatusMessage
