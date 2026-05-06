package nexis.ru.entity.request;

import lombok.Data;

@Data
public class LogoutRequest {
    String refreshToken;
}
