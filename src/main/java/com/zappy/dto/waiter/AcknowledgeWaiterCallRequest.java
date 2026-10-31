package com.zappy.dto.waiter;

import java.util.UUID;

public record AcknowledgeWaiterCallRequest(
    UUID userId
) {}
