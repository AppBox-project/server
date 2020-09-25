/*
 * The data manifest logs all default models and objects required for the system to run. It is seperated in required and optional parts.
 * On first launch, required and optional are merged and all data is loaded into the system.
 * On update (of server) a check is performed if the data version number changed. If it did it will perform the following actions
 * -> Required: Information is updated regardless of current value
 * -> Optional: Information is only updated if no current information is present (hence: customisation is possible)
 */

// Users
import {
  required as UserModelRequired,
  optional as UserModelOptional,
} from "./Models/Users";

// Apps
import {
  required as AppModelRequired,
  optional as AppModelOptional,
} from "./Models/Apps";

// System Tasks
import {
  required as SystemTaskModelRequired,
  optional as SystemTaskModelOptional,
} from "./Models/SystemTask";

// People
import {
  required as PeopleModelRequired,
  optional as PeopleModelOptional,
} from "./Models/People";

// Permissions
import {
  required as PermissionsModelRequired,
  optional as PermissionsModelOptional,
} from "./Models/Permissions";

// Roles
import {
  required as RolesModelRequired,
  optional as RolesModelOptional,
} from "./Models/Roles";

// Automations
import {
  required as AutomationsModelRequired,
  optional as AutomationsModelOptional,
} from "./Models/Automations";

// Object Extensions
import {
  required as ObjectExtensionsModelRequired,
  optional as ObjectExtensionsModelOptional,
} from "./Models/ObjectExtensions";

// Companies
import {
  required as CompaniesModelRequired,
  optional as CompaniesModelOptional,
} from "./Models/Companies";

// RlPersonCompanies
import {
  required as RlPersonCompanyModelRequired,
  optional as RlPersonCompanyModelOptional,
} from "./Models/RlPersonCompany";

import {
  required as RequiredObjects,
  optional as OptionalObjects,
} from "./Objects";

// Data manifest
const DataManifest = {
  version: "0.0.1",
  description: "Initial data",
  required: {
    models: {
      users: UserModelRequired,
      apps: AppModelRequired,
      "system-tasks": SystemTaskModelRequired,
      people: PeopleModelRequired,
      permissions: PermissionsModelRequired,
      roles: RolesModelRequired,
      automations: AutomationsModelRequired,
      "object-extensions": ObjectExtensionsModelRequired,
      companies: CompaniesModelRequired,
      "rl-person-company": RlPersonCompanyModelRequired,
    },
    objects: RequiredObjects,
  },
  optional: {
    models: {
      users: UserModelOptional,
      apps: AppModelOptional,
      "system-tasks": SystemTaskModelOptional,
      people: PeopleModelOptional,
      permissions: PermissionsModelOptional,
      roles: RolesModelOptional,
      automations: AutomationsModelOptional,
      "object-extensions": ObjectExtensionsModelOptional,
      companies: CompaniesModelOptional,
      "rl-person-company": RlPersonCompanyModelOptional,
    },
    objects: OptionalObjects,
  },
};

export default DataManifest;
