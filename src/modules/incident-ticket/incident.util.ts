export class IncidentUtils {
  constructor() {}
  
  static generateTicketId() {
    const randomNumber = Math.floor(1000000 + Math.random() * 9000000);
    return `INC${randomNumber}`;
  }
}
