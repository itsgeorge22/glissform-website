export const siteUrl = 'https://glissform.app/';
export const siteTitle = 'Glissform — Free MacBook Lid Animation';
export const siteDescription = 'Add subtle animations to everyday MacBook moments with Glissform, a free macOS app. Explore Seamless Close, an iPhone Duo-style lid animation, in the public beta.';
export const socialTitle = 'Glissform — A better closing act for your Mac';
export const socialDescription = 'Make closing your MacBook more satisfying with a smooth lid animation. Adjust the starting angle and blur to make it yours. Free for macOS.';
const publicBetaVersion = '0.1.0-beta.6';
export const downloadUrl = `/downloads/Glissform-${publicBetaVersion}.dmg`;
export const socialImage = new URL('assets/glissform-social.png', siteUrl).href;

export const softwareApplication = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': siteUrl + '#software-application',
  name: 'Glissform',
  url: siteUrl,
  description: siteDescription,
  applicationCategory: 'UtilitiesApplication',
  isAccessibleForFree: true,
  operatingSystem: 'macOS 15 or later',
  softwareVersion: publicBetaVersion,
  softwareRequirements: 'Seamless Close requires a compatible lid-angle sensor and Screen Recording permission. Tested on a MacBook Air M5 15-inch; other models are not yet verified.',
  downloadUrl: new URL(downloadUrl, siteUrl).href,
  image: socialImage,
};
