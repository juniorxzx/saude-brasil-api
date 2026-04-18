export interface IPatientProfileService {
  create(
    userId: string,
    createPatientProfileDto: {
      susCard?: string;
      bloodType?: string;
      allergies?: string[];
      medications?: string[];
      medicalConditions?: string[];
    },
  ): Promise<unknown>;

  findOne(userId: string): Promise<unknown>;

  update(
    userId: string,
    updatePatientProfileDto: {
      susCard?: string;
      bloodType?: string;
      allergies?: string[];
      medications?: string[];
      medicalConditions?: string[];
    },
  ): Promise<unknown>;

  remove(userId: string): Promise<{ message: string }>;
}
