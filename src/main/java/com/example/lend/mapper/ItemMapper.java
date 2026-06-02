package com.example.lend.mapper;

import com.example.lend.entity.Item;
import com.example.lend.dto.request.ItemCreateRequest;
import com.example.lend.dto.response.ItemResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface ItemMapper {
    @Mapping(target = "hasImage", expression = "java(item.hasImage())")
    ItemResponse toResponse(Item item);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "imageData", ignore = true)
    @Mapping(target = "imageType", ignore = true)
    @Mapping(target = "available", ignore = true)
    @Mapping(target = "nextAvailableDate", ignore = true)
    Item toEntity(ItemCreateRequest request);
}
