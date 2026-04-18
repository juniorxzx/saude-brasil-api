export interface IMedicalRecordService {
  create(
    doctorId: string,
    createMedicalRecordDto: {
      pacienteId: string;
      type: string;
      title: string;
      description: string;
      observations?: string;
      recordDate?: Date;
    },
  ): Promise<unknown>;

  findAll(
    filters: {
      skip?: number;
      take?: number;
      type?: string;
      patientId?: string;
    },
    userId: string,
    userRole: string,
  ): Promise<{
    data: unknown[];
    total: number;
  }>;

  findOne(id: string, userId: string, userRole: string): Promise<unknown>;

  update(
    id: string,
    updateMedicalRecordDto: {
      title?: string;
      description?: string;
      observations?: string;
    },
    userId: string,
  ): Promise<unknown>;

  remove(id: string, userId: string): Promise<{ message: string }>;
}
