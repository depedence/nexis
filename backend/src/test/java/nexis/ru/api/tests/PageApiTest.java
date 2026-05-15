package nexis.ru.api.tests;

import nexis.ru.api.client.PageClient;
import nexis.ru.api.models.PageModel;
import nexis.ru.infra.api.BaseAuthorizedApiTest;
import nexis.ru.support.data.PageDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.*;

public class PageApiTest extends BaseAuthorizedApiTest {

    private PageClient client;
    private PageModel body;

    @BeforeEach
    void setup() {
        client = new PageClient(authorizedRequestSpec);
        body = PageDataFactory.randomPage();
    }

    @Test
    void user_can_create_page__success() {
        client.createPage(body)
                .then()
                .body("content", equalTo(body.getContent()))
                .body("createdAt", notNullValue())
                .body("favorite", equalTo(false))
                .body("id", notNullValue())
                .body("parentId", nullValue())
                .body("position", equalTo(body.getPosition()))
                .body("title", equalTo(body.getTitle()))
                .body("type", equalTo(body.getType().name()))
                .statusCode(200);
    }
}