import type { DownloadPlacement } from './analytics';
import GlassDownloadLink from './GlassDownloadLink';
import { downloadUrl } from './siteMetadata';

export default function DownloadLink({ secondary = false, href = downloadUrl, secondaryLabel, placement }: {
  secondary?: boolean;
  href?: string;
  secondaryLabel?: string;
  placement?: DownloadPlacement;
}) {
  if (secondary) return <GlassDownloadLink href={href} label={secondaryLabel} placement={placement} />;
  return <a className="download-link" href={href} data-download-placement={placement}>
    <span>Download Glissform</span>
  </a>;
}
