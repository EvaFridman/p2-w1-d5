export class ListingPublishedEvent {
  static readonly eventName = 'listing.published';
  constructor(
    readonly listingId: number,
    readonly agentId: number,
    readonly title: string,
  ) {}
}
