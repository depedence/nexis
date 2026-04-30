package nexis.ru.entity.response;

public record AuthResponse(
        String token,
        String username
) {}