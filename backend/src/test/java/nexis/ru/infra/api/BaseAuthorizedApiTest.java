package nexis.ru.infra.api;

import io.restassured.builder.RequestSpecBuilder;
import io.restassured.specification.RequestSpecification;
import nexis.ru.api.client.AuthClient;
import nexis.ru.api.models.AuthModel;
import nexis.ru.support.data.UserDataFactory;
import org.junit.jupiter.api.BeforeEach;

public abstract class BaseAuthorizedApiTest extends BaseApiTest {

    protected RequestSpecification authorizedRequestSpec;
    protected AuthModel user;

    @BeforeEach
    void setupAuthorizedRestAssured() {
        user = UserDataFactory.randomUser();

        AuthClient authClient = new AuthClient(requestSpec);

        String token = authClient.register(user)
                .then()
                .statusCode(200)
                .extract().path("token");

        authorizedRequestSpec = new RequestSpecBuilder()
                .addRequestSpecification(requestSpec)
                .addHeader("Authorization", "Bearer " + token)
                .build();
    }
}