package com.verseny.portal;

import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.Course;
import com.verseny.portal.model.Role;
import com.verseny.portal.repository.CourseRepository;
import com.verseny.portal.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner seed(UserRepository users, CourseRepository courses, PasswordEncoder enc) {
        return args -> {
            if (users.count() == 0) {
                users.save(AppUser.builder()
                        .email("admin@portal.hu").passwordHash(enc.encode("password"))
                        .fullName("Admin Felhasználó").role(Role.ADMIN).build());
                AppUser oktato = users.save(AppUser.builder()
                        .email("oktato@portal.hu").passwordHash(enc.encode("password"))
                        .fullName("Dr. Példa Oktató").role(Role.OKTATO).build());
                users.save(AppUser.builder()
                        .email("hallgato@portal.hu").passwordHash(enc.encode("password"))
                        .fullName("Példa Hallgató").role(Role.HALLGATO).build());

                courses.save(Course.builder()
                        .code("VIMIAB00").title("Szoftvertechnikák")
                        .description("Modern szoftverfejlesztési módszerek.")
                        .credits(5).instructor(oktato).build());
                courses.save(Course.builder()
                        .code("VIMIAC04").title("Webfejlesztés")
                        .description("Frontend és backend technológiák.")
                        .credits(4).instructor(oktato).build());
            }
        };
    }
}
