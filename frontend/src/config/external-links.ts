export const EXTERNAL_LINKS = {
  dlpRegister2017: {
    url: 'https://data.opencity.in/dataset/bbmp-road-repair-and-maintenance-contractor-and-officials-details-2017',
    label: 'BBMP DLP Register (2017)',
  },
  openCityWorkOrders: {
    url: 'https://data.opencity.in/dataset/bbmp-work-orders-by-ward-2013-2022',
    label: 'OpenCity BBMP Work Orders (2013–2022)',
  },
  bbmpWorksBillPublicView: {
    url: 'https://account.bbmpgov.in/PublicView/?l=1',
    label: 'BBMP Works Bill Public View',
  },
} as const

export function resolveSourceUrl(sourceDocument: string): string {
  if (/^https?:\/\//i.test(sourceDocument)) return sourceDocument

  if (sourceDocument === 'dlp_east_2017.pdf') {
    return EXTERNAL_LINKS.dlpRegister2017.url
  }

  return EXTERNAL_LINKS.openCityWorkOrders.url
}
