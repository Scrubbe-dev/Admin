import {
  DetermineAction,
  Incident,
  IncidentComment,
  Message,
  User,
} from "@prisma/client";
import {
  MappedIncidents,
  RecommendedActionResponse,
} from "../ezra-chat/ezra.types";
import { Comment, MappedComment } from "./incident.types";

export class IncidentMapper {
  static mapIncidents(incident: Incident): MappedIncidents {
    return {
      createdAt: incident.createdAt,
      id: incident.id,
      description: incident.description,
      title: incident.title,
      priority: incident.priority,
    };
  }

  static mapRecommendedAction(
    actions?: RecommendedActionResponse["action"]
  ): DetermineAction[] {
    const mappedAction: Record<
      RecommendedActionResponse["action"][number],
      DetermineAction
    > = {
      lock_account: DetermineAction.LOCK_ACCOUNT,
      notify_analyst: DetermineAction.NOTIFY_ANALYST,
      quarantine: DetermineAction.QUARANTINE,
      terminate_session: DetermineAction.TERMINATE_SESSION,
    };

    return actions?.map((action) => mappedAction[action]) || [];
  }

  static mapToCommentResponse(comment: Comment): MappedComment {
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      firstname: comment.firstname,
      lastname: comment.lastname,
      isBusinessOwner: comment.isBusinessOwner,
    };
  }

  static messageMapper(message: Message & { sender: User }) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        firstname: message.sender.firstName,
        lastname: message.sender.lastName,
        email: message.sender.email,
      },
    };
  }
}
