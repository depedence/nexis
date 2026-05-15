package nexis.ru.api.tests;

import nexis.ru.api.client.AuthClient;
import nexis.ru.api.models.AuthModel;
import nexis.ru.infra.api.BaseApiTest;
import nexis.ru.support.data.UserDataFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

public class AuthApiTest extends BaseApiTest {

    private AuthClient client;
    private AuthModel body;
    private AuthModel invalidBody;

    @BeforeEach
    void setup() {
        dbCleaner.cleanDb();
        client = new AuthClient(requestSpec);
        body = UserDataFactory.randomUser();
        invalidBody = UserDataFactory.invalidUser();
    }

    @AfterEach
    void teardown() {
        dbCleaner.cleanDb();
    }

    // ===== Register =====

    @Test
    void user_can_register__success() {
        client.register(body)
                .then()
                .body("token", notNullValue())
                .body("refreshToken", notNullValue())
                .body("username", equalTo(body.getUsername()))
                .statusCode(200);
    }

    @Test
    void user_cannot_register_with_blank_username__failed() {
        client.register(invalidBody)
                .then()
                .body("message", equalTo("Username is required"))
                .body("timestamp", notNullValue())
                .statusCode(400);
    }

    @Test
    void user_cannot_register_with_duplicate_username__failed() {
        client.register(body)
                .then()
                .statusCode(200);

        client.register(body)
                .then()
                .body("message", equalTo("Username is already taken"))
                .body("timestamp", notNullValue())
                .statusCode(409);
    }

    // ===== Login =====

    @Test
    void user_can_login__success() {
        client.register(body)
                .then()
                .statusCode(200);

        client.login(body)
                .then()
                .body("token", notNullValue())
                .body("refreshToken", notNullValue())
                .body("username", equalTo(body.getUsername()))
                .statusCode(200);
    }

    @Test
    void user_cannot_login_without_account__failed() {
        client.login(body)
                .then()
                .body("message", equalTo("User not found"))
                .body("timestamp", notNullValue())
                .statusCode(404);
    }

    @Test
    void user_cannot_login_with_invalid_password__failed() {
        client.register(body)
                .then()
                .statusCode(200);

        AuthModel bodyWithIncorrectPass = new AuthModel();
        bodyWithIncorrectPass.setUsername(body.getUsername());
        bodyWithIncorrectPass.setPassword("12345");

        client.login(bodyWithIncorrectPass)
                .then()
                .body("message", equalTo("Invalid password"))
                .body("timestamp", notNullValue())
                .statusCode(400);
    }
}