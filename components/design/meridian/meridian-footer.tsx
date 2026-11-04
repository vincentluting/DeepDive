import { ScriptCoda } from "./script-coda";

/**
 * MeridianFooter — the three-piece sign-off band shared by landing + app pages.
 * Left: privacy orb · Center: evidence orb · Right: Script Coda.
 * Copy comes from the caller's i18n dictionary (no hardcoded strings).
 */
export interface MeridianFooterCopy {
  privacyTitle: string;
  privacyLine: string;
  evidenceTitle: string;
  evidenceLine: string;
  coda: string;
}

export interface MeridianFooterProps {
  copy: MeridianFooterCopy;
  className?: string;
}

export function MeridianFooter({ copy, className }: MeridianFooterProps) {
  return (
    <footer className={["md-footer", className].filter(Boolean).join(" ")}>
      <div className="md-footer__item">
        <span className="md-orb" aria-hidden="true">
          A
        </span>
        <span className="md-footer__text">
          {copy.privacyTitle}
          <br />
          {copy.privacyLine}
        </span>
      </div>
      <div className="md-footer__item">
        <span className="md-orb" aria-hidden="true">
          E
        </span>
        <span className="md-footer__text">
          {copy.evidenceTitle}
          <br />
          {copy.evidenceLine}
        </span>
      </div>
      <div className="md-footer__item md-footer__item--coda">
        <ScriptCoda text={copy.coda} />
      </div>
    </footer>
  );
}
