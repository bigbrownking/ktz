package org.ktz.ktzsimulator;

import org.ktz.ktzsimulator.model.LocomotiveProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableConfigurationProperties(LocomotiveProperties.class)
@SpringBootApplication
@EnableScheduling
public class KtzSimulatorApplication {

	public static void main(String[] args) {
		SpringApplication.run(KtzSimulatorApplication.class, args);
	}

}
