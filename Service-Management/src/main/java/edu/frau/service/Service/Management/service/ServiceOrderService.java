package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.dto.*;

import java.util.List;

public interface ServiceOrderService {

    List<OrderDetailsDTO> getAllOrdersForCurrentUser();

    List<OrderDetailsDTO> getOrdersForRequest(Long requestId);

    OrderDetailsDTO getOrderDetails(Long orderId);

    // ✅ RP final decision
    OrderDetailsDTO approveOrder(Long orderId, String rpUsername);

    OrderDetailsDTO rejectOrder(Long orderId, String rpUsername, OrderRejectRequest body);

    // ✅ PM feedback
    OrderDetailsDTO submitFeedback(Long orderId, String pmUsername, OrderFeedbackRequest body);

    OrderDetailsDTO requestSubstitution(Long orderId, String username, OrderSubstitutionRequest body);

    OrderDetailsDTO requestExtension(Long orderId, String username, OrderExtensionRequest body);

    OrderDetailsDTO approveChange(Long orderId, String rpUsername);

    OrderDetailsDTO applyGroup4ChangeDecision(Long orderId, Group3ChangeDecisionDTO body);


    OrderDetailsDTO rejectChange(Long orderId, String rpUsername, OrderChangeRejectRequest body);

}
