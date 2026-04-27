package nexis.ru.mapper;

import nexis.ru.entity.Page;
import nexis.ru.entity.dto.PageDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PageMapper {

    PageDto toDto(Page page);

    Page toEntity(PageDto pageDto);

}