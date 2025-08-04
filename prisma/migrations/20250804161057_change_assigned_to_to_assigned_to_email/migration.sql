-- AddForeignKey
ALTER TABLE "IncidentTicket" ADD CONSTRAINT "IncidentTicket_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "Invites"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
