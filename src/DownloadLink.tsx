import GlassDownloadLink from './GlassDownloadLink';
import { downloadUrl } from './siteMetadata';

export default function DownloadLink({ secondary = false, href = downloadUrl, secondaryLabel }: {
  secondary?: boolean;
  href?: string;
  secondaryLabel?: string;
}) {
  if (secondary) return <GlassDownloadLink href={href} label={secondaryLabel} />;
  return <a className="download-link" href={href}>
    <span>Download Glissform</span>
  </a>;
}
