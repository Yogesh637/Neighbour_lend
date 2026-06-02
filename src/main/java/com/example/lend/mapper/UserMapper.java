package com.example.lend.mapper;

import com.example.lend.entity.Role;
import com.example.lend.entity.User;
import com.example.lend.dto.request.UserRegisterRequest;
import com.example.lend.dto.response.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "roles", source = "roles", qualifiedByName = "rolesToStrings")
    UserResponse toResponse(User user);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "verified", ignore = true)
    @Mapping(target = "otp", ignore = true)
    @Mapping(target = "otpExpiry", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "wishlistedItems", ignore = true)
    User toEntity(UserRegisterRequest request);

    @Named("rolesToStrings")
    default Set<String> rolesToStrings(Set<Role> roles) {
        if (roles == null) return Collections.emptySet();
        return roles.stream().map(Role::name).collect(Collectors.toSet());
    }
}
