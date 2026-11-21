/** Mirror of `TicketEdgeDto` (Torii.Api.Dtos): the source customer may send tickets to the target. */
export interface TicketEdge {
  id: number;
  sourceCustomerId: number;
  sourceCustomerName: string;
  targetCustomerId: number;
  targetCustomerName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface TicketEdgeUpdate {
  sourceCustomerId: number;
  targetCustomerId: number;
  isActive: boolean;
}
