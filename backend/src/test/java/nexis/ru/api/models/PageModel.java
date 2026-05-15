package nexis.ru.api.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nexis.ru.entity.PageType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageModel {

    Long parentId;
    String title;
    String content;
    PageType type;
    int position;
}