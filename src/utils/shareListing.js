import { Platform } from 'react-native';
import { WEB_URL } from './api';

/** Canonical web listing URL. Deep linking is not enabled in the app. */
export function listingShareUrl(adId, origin = WEB_URL) {
  const base = String(origin || 'https://dealrapp.in').replace(/\/$/, '');
  const id = adId != null ? String(adId).trim() : '';
  if (!id) return base;
  return `${base}/ad/${encodeURIComponent(id)}`;
}

export function listingShareText(listing) {
  const title = String(listing?.title || 'Listing on Dealr').trim();
  const priceNum = Number(listing?.price);
  const price = Number.isFinite(priceNum) ? `₹${priceNum.toLocaleString('en-IN')}` : '';
  const location = String(listing?.location || '').trim();
  const details = [price, location].filter(Boolean).join(' · ');
  return details ? `${title} — ${details}` : title;
}

export function listingShareContent(listing) {
  const adId = listing?.id || listing?._id;
  const url = listingShareUrl(adId);
  const text = listingShareText(listing);

  // iOS uses `url` as a separate field; Android only shares `message`.
  if (Platform.OS === 'ios') {
    return { title: text, message: text, url };
  }
  return { title: text, message: `${text}\n${url}` };
}
