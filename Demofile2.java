package com.example.demo.service;

import com.example.demo.model.ServiceDefinition;
import com.example.demo.model.ServiceRegistry;
import com.example.demo.repository.ServiceRegistryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class ServiceRegistryManager {
	
   @Autowired
   private ServiceRegistryRepository serviceRegistryRepository;
   public void registerService(ServiceDefinition serviceDefinition) {
       ServiceRegistry existingService = serviceRegistryRepository
               .findByServiceName(serviceDefinition.getServiceName())
               .orElse(null);
       if (existingService == null) {
           ServiceRegistry newService = new ServiceRegistry();
           newService.setServiceName(serviceDefinition.getServiceName());
           newService.setUrl(serviceDefinition.getUrl());
           newService.setSupportedActions(serviceDefinition.getSupportedActions());
           serviceRegistryRepository.save(newService);
       }
   }
}
