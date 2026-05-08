package nexis.ru.ui.tests;

import java.util.UUID;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import nexis.ru.infra.ui.BaseUiTest;
import nexis.ru.ui.page.AuthPage;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AuthUiTest extends BaseUiTest {

    private String random = UUID.randomUUID().toString().substring(0, 4);
    private String username = "username_" + random;
    private String password = "password_" + random;

    @Test
    @Order(1)
    void user_can_register__valid() {
        new AuthPage()
                .openRegister()
                .fillInputs(username, password, true)
                .clickAuthBtn()
                .shouldBeRedirectTo("/pages");
    }

    @Test
    @Order(2)
    void user_can_login__valid() {
        new AuthPage()
                .openLogin()
                .fillInputs(username, password, false)
                .clickAuthBtn()
                .shouldBeRedirectTo("/pages");
    }

    @Test
    @Order(3)
    void user_cant_login__invalid() {
        new AuthPage()
                .openLogin()
                .fillInputs("invalidUsername", "invalidPassword", false)
                .clickAuthBtn()
                .formErrorIsVisible();
    }
}
