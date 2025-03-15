import { Request, Response } from 'express';
import School, { ISchool } from '../models/school';
import school from '../models/school';
import UserModel, { IUser } from '../models/user';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "school" | "instructor";
    schoolId?: string;
    phone?: string;
    address?: string;
    bio?: string;
    profileImage?: string;
    approved?: boolean;
  };
}

// 1. Create a School (Approval Required)
export const createSchool = (req: Request, res: Response): void => {
  const schoolData: ISchool = req.body;
  schoolData.isApproved = false; 

  const school = new School(schoolData);

  school
    .save()
    .then((savedSchool) => {
      res.status(201).json({
        message: "School created successfully! Waiting for admin approval.",
        data: savedSchool,
        success: true
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Error creating school",
        error,
        success: false
      });
    });
};

// 2. Approve a School (Admin Only)
export const approveSchool = (req: Request, res: Response): void => {
  const { schoolID } = req.params;

  School.findOneAndUpdate({ schoolID }, { isApproved: true }, { new: true })
    .then((updatedSchool) => {
      if (updatedSchool) {
        res.status(200).json({
          message: "School approved successfully!",
          data: updatedSchool,
          success: true
        });
      } else {
        res.status(404).json({
          message: "School not found",
          success: false
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Error approving school",
        error,
        success: false
      });
    });
};

// 7. Reject a School (Admin Only)
export const rejectSchool = (req: Request, res: Response): void => {
  const { schoolID } = req.params;

  School.findOneAndUpdate({ schoolID }, { isApproved: false }, { new: true })
    .then((rejectedSchool) => {
      if (rejectedSchool) {
        res.status(200).json({
          message: "School rejected successfully!",
          data: rejectedSchool,
          success: true
        });
      } else {
        res.status(404).json({
          message: "School not found",
          success: false
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Error rejecting school",
        error,
        success: false
      });
    });
};


// 3. Get All Approved Schools
export const getAllSchools = (req: Request, res: Response): void => {
  School.aggregate([
    { $match: { isApproved: true } }, // Only fetch approved schools
    {
      $project: {
        schoolName: 1,
        schoolID: 1,
        isApproved: 1, // Include isApproved in the response
      }
    }
  ])
    .then((schools) => {
      res.status(200).json({
        message: "Approved schools fetched successfully!",
        data: schools,
        success: true
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Error fetching schools",
        error,
        success: false
      });
    });
};

// 4. Get a Single Approved School by ID
export const getSchoolById = (req: Request, res: Response): void => {
  const { schoolID } = req.params;

  School.aggregate([
    { $match: { schoolID, isApproved: true } }, // Only fetch approved schools
    {
      $project: {
        schoolName: 1,
        schoolID: 1,
        headOfSchool: 1,
        address: 1,
        contact: 1,
        message: 1,
        createdAt: 1,
        updatedAt: 1,
        isApproved: 1, // Include isApproved in the response
      }
    }
  ])
    .then((school) => {
      if (school.length > 0) {
        res.status(200).json({
          message: "School fetched successfully!",
          data: school[0],
          success: true
        });
      } else {
        res.status(404).json({
          message: "School not found or not approved",
          success: false
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Error fetching school",
        error,
        success: false
      });
    });
};

// 5. Update a School (Before Approval)
export const updateSchool = (req: Request, res: Response): void => {
  const { schoolID } = req.params;
  const updatedData = req.body;

  School.findOneAndUpdate({ schoolID }, updatedData, { new: true })
    .then((updatedSchool) => {
      if (!updatedSchool) {
        return res.status(404).json({
          message: "School not found",
          success: false
        });
      }

      res.status(200).json({
        message: "School updated successfully!",
        data: updatedSchool,
        success: true
      });
    })
    .catch((error) => {
      console.error("Error updating school:", error);
      res.status(500).json({
        message: "Error updating school",
        error,
        success: false
      });
    });
};


// 6. Delete a School (Before Approval)
export const deleteSchool = (req: Request, res: Response): void => {
  const { schoolID } = req.params;

  console.log("Deleting School:", schoolID);

  School.findOneAndDelete({ schoolID }) 
    .then((deletedSchool) => {
      if (!deletedSchool) {
        return res.status(404).json({
          message: "School not found",
          success: false
        });
      }

      res.status(200).json({
        message: "School deleted successfully!",
        data: deletedSchool,
        success: true
      });
    })
    .catch((error) => {
      console.error("Error deleting school:", error);
      res.status(500).json({
        message: "Error deleting school",
        error,
        success: false
      });
    });
};

// 7. Fet all student related to school
export const getAllStudent = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user?.id; // Get school ID from logged-in user
    if (!schoolId) {
       res.status(400).json({ message: "School ID not found in request" });
       return;
    }

    const students = await UserModel.find({ schoolID: schoolId, role: "user" });

    res.status(200).json({
      message: "Students retrieved successfully",
      data: students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error" });
  }
};