import './privacy-section.scss';

const privacyNotes = [
  {
    title: 'One screenshot per gesture',
    description: 'Screen Recording access lets Glissform capture one still image.',
  },
  {
    title: 'Never saved or shared',
    description: 'Screen images stay in memory. Never saved or uploaded.',
  },
  {
    title: 'No analytics',
    description: 'No usage analytics. Glissform connects for update checks and downloads.',
  },
];

export default function PrivacySection() {
  return <section className="privacy-section home-next-desktop" aria-labelledby="privacy-title">
    <div className="privacy-section__panel" id="privacy">
      <div className="privacy-section__intro">
        <div className="privacy-section__icon-slot" aria-hidden="true">
          <div className="privacy-section__icon-frame">
            <img src={`${import.meta.env.BASE_URL}assets/privacy-shield.svg`} width="34" height="40" alt="" />
          </div>
        </div>
        <div className="privacy-section__text">
          <h2 id="privacy-title">Your screen<br />stays private</h2>
          <p>Your screen images stay on your Mac.{' '}<br />No continuous recording.</p>
        </div>
      </div>
      <div className="privacy-section__notes">
        {privacyNotes.map(({ title, description }) => (
          <div className="privacy-section__note" key={title}>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>;
}
