package nexis.ru.entity.request;

import lombok.Data;
import nexis.ru.entity.PageType;

@Data
public class CreatePageRequest {

    Long parentId;
    String title;
    String content;
    PageType type;
    int position;

}
