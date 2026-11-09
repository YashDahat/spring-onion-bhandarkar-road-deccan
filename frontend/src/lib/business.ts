// Facts about the Bhandarkar Road outlet, used across pages (from public listings).
export const BUSINESS = {
  name: 'Spring Onion',
  outlet: 'Bhandarkar Road, Deccan',
  address: 'Shop No-4B, Ground Floor, Millennium Tower, Bhandarkar Rd, Deccan Gymkhana, Pune 411004',
  phoneDisplay: '+91 97677 22444',
  phoneTel: '+919767722444',
  whatsappNumber: '919767722444',
  hoursText: 'Daily 11:30 am – 3:30 pm · 6:30 pm – 11:30 pm',
  hours: [
    { label: 'Lunch', time: '11:30 am – 3:30 pm' },
    { label: 'Dinner', time: '6:30 pm – 11:30 pm' },
  ],
  lat: 18.5181632,
  lng: 73.8381977,
  mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=18.5181632,73.8381977&destination_place_id=ChIJyUIXOIa_wjsRPEWQF-01YRc',
  mapEmbedUrl: 'https://maps.google.com/maps?q=Spring%20Onion%20Bhandarkar%20Road%20Deccan%20Pune&z=16&output=embed',
  rating: 4.2,
  reviewCount: 1767,
  whatsappUrl(text = 'Hi Spring Onion! ') {
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(text)}`;
  },
};

/** wa.me share link with no fixed recipient (lets the guest pick a friend). */
export function whatsappShare(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
