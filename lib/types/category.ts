/** The API-facing category shape, shared by server and client (no server-only deps). */
export type Category = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
