import {
    IdentitystoreClient,
    ListUsersCommand,
    CreateUserCommand,
    CreateGroupMembershipCommand,
    ListUsersCommandInput,
    CreateUserCommandInput,
    CreateGroupMembershipCommandInput,
  } from "@aws-sdk/client-identitystore";
  import config from "config";
  
  // Define the configuration variables with proper types
  const accessKeyId: string = config.get<string>("aws.access_key");
  const secretAccessKey: string = config.get<string>("aws.secret_key");
  const region: string = config.get<string>("aws.region");
  const identityStoreId: string = config.get<string>("aws.identity_store_id");
  
  let client: IdentitystoreClient;
  
  /**
   * Configures AWS SDK credentials and returns a singleton IdentitystoreClient instance.
   * @returns {IdentitystoreClient} Singleton AWS Identitystore client
   */
  function configureAWSCredentials(): IdentitystoreClient {
    if (!client) {
      if (accessKeyId && secretAccessKey) {
        client = new IdentitystoreClient({
          region: region,
          credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
          },
        });
      }
    }
    return client!;
  }
  
  /**
   * Lists users from AWS Identity Store filtered by username.
   * @param {string} username - Username to filter users by
   * @returns {Promise<string | null>} - UserId if found, otherwise null
   */
  export const fetchUserIdFromUsername = async (username: string): Promise<string | null> => {
    const client = configureAWSCredentials();
  
    const getUserByIdCommand: ListUsersCommandInput = {
      IdentityStoreId: identityStoreId,
      Filters: [
        {
          AttributePath: "Username",
          AttributeValue: username,
        },
      ],
    };
  
    try {
      const response = await client.send(new ListUsersCommand(getUserByIdCommand));
  
      if (response.Users && response.Users.length > 0) {
        const userId = response.Users[0].UserId!;
        return userId;
      } else {
        console.error("No users found for the provided username.");
        return null;
      }
    } catch (err) {
      throw new Error(`Failed to list users: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  /**
   * Creates the user in the Identity store.
   * @param {string} username - The username to create.
   * @param {string} email - The email to associate with the user.
   * @returns {Promise<any>} - The AWS response or error.
   */
  export const createUser = async (username: string, email: string): Promise<any> => {
    const client = configureAWSCredentials();
  
    const params: CreateUserCommandInput = {
      IdentityStoreId: identityStoreId,
      UserName: username,
      Name: {
        Formatted: username,
        FamilyName: username,
        GivenName: username,
      },
      DisplayName: username,
      Emails: [
        {
          Value: email,
          Type: "work",
          Primary: true,
        },
      ],
    };
  
    try {
      const command = new CreateUserCommand(params);
      const response = await client.send(command);
      console.info(`The response from create user ${response}`);
      return response;
    } catch (error) {
      console.error(`The error from create user ${error}`);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  /**
   * This function adds the user to the IAM group.
   * @param {string} groupId - The group ID to add the user to.
   * @param {string} userId - The user ID to add to the group.
   * @returns {Promise<any>} - The AWS response or error.
   */
export const addUserToGroup = async (groupId: string, awsUserId: string): Promise<any> => {
    const client = configureAWSCredentials();
  
    const params: CreateGroupMembershipCommandInput = {
      IdentityStoreId: identityStoreId,
      GroupId: groupId,
      MemberId: {
        UserId: awsUserId,
      },
    };
  
    try {
      const command = new CreateGroupMembershipCommand(params);
      const response = await client.send(command);
      return response;
    } catch (error) {
      console.error("Error adding user to group:", error);
      if (error.__type === 'ConflictException'){
        return { conflict: true };
      }

      throw new Error(`Failed to add user to group: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  /**
   * Function to get UserId by username from AWS Identity Store.
   * @param {string} username - The username of the user.
   * @returns {Promise<string | null>} - The UserId if found, otherwise null.
   */
  export const fetchAwsUserIdByUsername = async (username: string): Promise<string | null> => {
    const client = configureAWSCredentials();
  
    const params: ListUsersCommandInput = {
      IdentityStoreId: identityStoreId,
      Filters: [
        {
          AttributePath: "UserName",
          AttributeValue: username,
        },
      ],
    };
  
    try {
      const response = await client.send(new ListUsersCommand(params));
  
      if (response.Users && response.Users.length > 0) {
        const userId = response.Users[0].UserId!;
        return userId;
      } else {
        console.info(`User not found with given username ${username} in AWS`);
        return null;
      }
    } catch (error) {
      console.error(`Error while fetching user by username: ${error}`);
      return null;
    }
  };
  