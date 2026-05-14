package nexis.ru.unit;

import lombok.RequiredArgsConstructor;
import nexis.ru.entity.RefreshToken;
import nexis.ru.entity.User;
import nexis.ru.entity.UserRole;
import nexis.ru.entity.request.LoginRequest;
import nexis.ru.entity.request.RegisterRequest;
import nexis.ru.entity.response.AuthResponse;
import nexis.ru.repository.UserRepository;
import nexis.ru.service.AuthService;
import nexis.ru.service.JwtService;
import nexis.ru.service.RefreshTokenService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

@RequiredArgsConstructor
public class AuthServiceTest {

    private final UserRepository userRepository = Mockito.mock(UserRepository.class);
    private final JwtService jwtService = Mockito.mock(JwtService.class);
    private final RefreshTokenService refreshTokenService = Mockito.mock(RefreshTokenService.class);
    private final PasswordEncoder passwordEncoder = Mockito.mock(PasswordEncoder.class);
    private final AuthService authService = new AuthService(
            userRepository,
            jwtService,
            refreshTokenService,
            passwordEncoder
    );

    @Test
    void shouldRegisterUserSuccessfully() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("Max");
        request.setPassword("MaxGTR");

        User savedUser = new User();
        savedUser.setUsername(request.getUsername());
        savedUser.setPassword(request.getPassword());
        savedUser.setUserRole(UserRole.USER);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("refresh-token");

        Mockito.when(userRepository.existsByUsername(request.getUsername())).thenReturn(false);
        Mockito.when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
        Mockito.when(userRepository.save(Mockito.any(User.class))).thenReturn(savedUser);
        Mockito.when(jwtService.generateToken(request.getUsername())).thenReturn("access-token");
        Mockito.when(refreshTokenService.createRefreshToken(savedUser)).thenReturn(refreshToken);

        AuthResponse response = authService.register(request);

        assertEquals("access-token", response.token());
        assertEquals("refresh-token", response.refreshToken());
        assertEquals(request.getUsername(), response.username());

        Mockito.verify(userRepository, Mockito.times(1)).existsByUsername(request.getUsername());
        Mockito.verify(passwordEncoder, Mockito.times(1)).encode(request.getPassword());
        Mockito.verify(userRepository, Mockito.times(1)).save(Mockito.any(User.class));
        Mockito.verify(jwtService, Mockito.times(1)).generateToken(request.getUsername());
        Mockito.verify(refreshTokenService, Mockito.times(1)).createRefreshToken(savedUser);
    }

    @Test
    void shouldLoginSuccessfully() {
        LoginRequest request = new LoginRequest();
        request.setUsername("Max");
        request.setPassword("MaxGTR");

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword("encoded-password");

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("refresh-token");

        Mockito.when(userRepository.findByUsername(request.getUsername())).thenReturn(Optional.of(user));
        Mockito.when(passwordEncoder.matches(request.getPassword(), user.getPassword())).thenReturn(true);
        Mockito.when(jwtService.generateToken(request.getUsername())).thenReturn("access-token");
        Mockito.when(refreshTokenService.createRefreshToken(user)).thenReturn(refreshToken);

        AuthResponse response = authService.login(request);

        assertEquals("access-token", response.token());
        assertEquals("refresh-token", response.refreshToken());
        assertEquals(request.getUsername(), response.username());

        Mockito.verify(userRepository, Mockito.times(1)).findByUsername(request.getUsername());
        Mockito.verify(passwordEncoder, Mockito.times(1)).matches(request.getPassword(), user.getPassword());
        Mockito.verify(jwtService, Mockito.times(1)).generateToken(request.getUsername());
        Mockito.verify(refreshTokenService, Mockito.times(1)).createRefreshToken(user);
    }
}