package nexis.ru.controller;

import lombok.RequiredArgsConstructor;
import nexis.ru.entity.RefreshToken;
import nexis.ru.entity.User;
import nexis.ru.entity.request.LoginRequest;
import nexis.ru.entity.request.LogoutRequest;
import nexis.ru.entity.request.RefreshTokenRequest;
import nexis.ru.entity.request.RegisterRequest;
import nexis.ru.entity.response.AuthResponse;
import nexis.ru.service.AuthService;
import nexis.ru.service.JwtService;
import nexis.ru.service.RefreshTokenService;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthRestController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@RequestBody RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenService.findByToken(request.getRefreshToken());
        refreshTokenService.verifyExpiration(refreshToken);

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateToken(user.getUsername());

        return new AuthResponse(newAccessToken, refreshToken.getToken(), user.getUsername());
    }

    @PostMapping("/logout")
    public void logout(@RequestBody LogoutRequest request) {
        RefreshToken refreshToken = refreshTokenService.findByToken(request.getRefreshToken());
        refreshTokenService.deleteByUser(refreshToken.getUser());
    }
}
