export interface AuthResponseDTO {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    organizationId: string;
    organizationName: string;
    permissions: string[];
  };
}
