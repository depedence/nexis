package nexis.ru.support.data;

import net.datafaker.Faker;
import nexis.ru.api.models.PageModel;
import nexis.ru.entity.PageType;

public class PageDataFactory {

    private static final Faker faker = new Faker();

    public static PageModel randomPage() {
        return PageModel.builder()
                .parentId(null)
                .title(faker.book().title())
                .content(faker.text().toString())
                .type(PageType.NOTE)
                .position(0)
                .build();
    }
}